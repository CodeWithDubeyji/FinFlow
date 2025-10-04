import { Inngest } from 'inngest'

export const inngest = new Inngest({
    id: 'finflow',
    ai: {gemini: {apikey: process.env.GEMINI_API_KEY!}},
})