import { inngest } from '@/lib/inngest/client'
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT
} from './prompts'

import {
  sendWelcomeEmail,
  sendDailyNewsSummaryEmail
} from '@/lib/nodemailer/index'

import { getAllUsersForNewsEmail } from '../actions/user.actions'
import { getWatchlistSymbolsByEmail } from '../actions/watchlist.actions'
import { getNews } from '../actions/finnhub.actions'
import { formatDateToday } from '../utils'

export const sendSignUpEmail = inngest.createFunction(
  { id: 'send-signup-email' },
  { event: 'app/user.created' },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
        `

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      '{{userProfile}}',
      userProfile
    )

    const response = await step.ai.infer('generate-welcome-intro', {
      model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
      body: {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      }
    })

    await step.run('send-welcome-email', async () => {
      const parts = response.candidates?.[0]?.content?.parts?.[0]
      const introText =
        (parts && 'text' in parts ? parts.text : null) ||
        'Thanks for joining FinFlow. You now have the tools to track markets and make smarter moves.'

      const {
        data: { email, name }
      } = event

      return await sendWelcomeEmail({
        email,
        name,
        intro: introText
      })
    })

    return { success: true, message: 'Welcome email sent successfully' }
  }
)

export const sendDailyNewsSummary = inngest.createFunction(
  { id: 'daily-news-summary' },
  [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }],
  async ({ step }) => {
    // Step 1: Get all users for news delivery
    const users = await step.run('get-all-users', getAllUsersForNewsEmail)

    if (!users || users.length === 0) {
      return { success: false, message: 'No users found' }
    }

    // Step 2: For each user, get their watchlist symbols and fetch news
    const userNewsData = await step.run('fetch-user-news', async () => {
      const perUser: Array<{
        user: User
        articles: MarketNewsArticle[]
        hasWatchlist: boolean
      }> = []

      for (const user of users) {
        try {
          // Get user's watchlist symbols
          const symbols = await getWatchlistSymbolsByEmail(user.email)
          const hasWatchlist = symbols.length > 0

          // Fetch news (personalized if symbols exist, general otherwise)
          let articles = hasWatchlist ? await getNews(symbols) : await getNews()

          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6)

          // If still empty after personalized fetch, fallback to general
          if (hasWatchlist && articles.length === 0) {
            articles = await getNews()
            articles = (articles || []).slice(0, 6)
          }

          perUser.push({ user, articles, hasWatchlist })
        } catch (error) {
          console.error(`Error fetching news for user ${user.email}:`, error)
          perUser.push({ user, articles: [], hasWatchlist: false })
        }
      }

      return perUser
    })

    // Step 3: Summarize news via AI
    const userNewsSummaries = await Promise.all(
      userNewsData.map(async ({ user, articles }) => {
        return await step.run(`summarize-news-${user.email}`, async () => {
          try {
            const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
              '{{newsData}}',
              JSON.stringify(articles, null, 2)
            )
            const response = await step.ai.infer(`ai-infer-${user.email}`, {
              model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
              body: {
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: prompt }]
                  }
                ]
              }
            })

            const part = response.candidates?.[0]?.content?.parts?.[0]
            const newsContent =
              (part && 'text' in part ? part.text : null) || 'No market news.'
            return { user, newsContent }
          } catch (e) {
            console.error(`Failed to summarize news for user ${user.email}:`, e)
            return { user, newsContent: null }
          }
        })
      })
    )

    // Step 4: Send the emails with proper error handling
    const emailResults = await step.run('send-news-emails', async () => {
      const results = await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }): Promise<boolean> => {
          if (!newsContent) {
            console.log(`Skipping email for ${user.email}: no news content`)
            return false
          }

          try {
            await sendDailyNewsSummaryEmail({
              email: user.email,
              date: formatDateToday(),
              newsContent
            })
            console.log(`Successfully sent news summary email to ${user.email}`)
            return true
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error(`Failed to send news summary email to ${user.email}:`, errorMessage)
            return false
          }
        })
      )

      const successfulEmails = results.filter(result => result).length
      const failedEmails = results.filter(result => !result).length

      console.log(`Email batch completed: ${successfulEmails} successful, ${failedEmails} failed`)

      return { successfulEmails, failedEmails, results }
    })

    return {
      success: true,
      message: `Processed news for ${users.length} users`,
      details: {
        emailsSent: emailResults.successfulEmails,
        emailsFailed: emailResults.failedEmails
      }
    }
  }
)
