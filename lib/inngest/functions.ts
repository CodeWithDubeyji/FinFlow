import { inngest } from '@/lib/inngest/client'
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from './prompts'
import { sendWelcomeEmail } from '@/lib/nodemailer/index'

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
