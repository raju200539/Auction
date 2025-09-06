'use server';

/**
 * @fileOverview Generates a dynamic player card using AI based on player data.
 *
 * - generateDynamicPlayerCard - A function that generates the player card.
 * - GenerateDynamicPlayerCardInput - The input type for the generateDynamicPlayerCard function.
 * - GenerateDynamicPlayerCardOutput - The return type for the generateDynamicPlayerCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDynamicPlayerCardInputSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  position: z.string().describe('The position of the player.'),
  photoUrl: z.string().describe(
    'A URL of the player photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* added comment */
  ),
  teamName: z.string().describe('The name of the team that bought the player.'),
  teamLogoUrl: z.string().describe(
    'A URL of the team logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* added comment */
  ),
  bidAmount: z.number().describe('The bid amount for the player.'),
  remainingPurse: z.number().describe('The remaining purse of the team.'),
});
export type GenerateDynamicPlayerCardInput = z.infer<
  typeof GenerateDynamicPlayerCardInputSchema
>;

const GenerateDynamicPlayerCardOutputSchema = z.object({
  playerCardDataUri: z
    .string()
    .describe(
      'The data URI of the generated player card image, which includes MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateDynamicPlayerCardOutput = z.infer<
  typeof GenerateDynamicPlayerCardOutputSchema
>;

export async function generateDynamicPlayerCard(
  input: GenerateDynamicPlayerCardInput
): Promise<GenerateDynamicPlayerCardOutput> {
  return generateDynamicPlayerCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDynamicPlayerCardPrompt',
  input: {schema: GenerateDynamicPlayerCardInputSchema},
  output: {schema: GenerateDynamicPlayerCardOutputSchema},
  prompt: `You are an AI that generates visually appealing player cards for a football league auction.

  Create a player card with the following information:
    - Player Name: {{{playerName}}}
    - Position: {{{position}}}
    - Player Photo: {{media url=photoUrl}}
    - Bought By: {{{teamName}}} with team logo: {{media url=teamLogoUrl}}
    - Bid Amount: {{{bidAmount}}}
    - Remaining Purse: {{{remainingPurse}}}

  The player card should be visually appealing and suitable for showcasing the auction results.
  Return the image as a data URI.`, // Ensure the prompt is a single string
});

const generateDynamicPlayerCardFlow = ai.defineFlow(
  {
    name: 'generateDynamicPlayerCardFlow',
    inputSchema: GenerateDynamicPlayerCardInputSchema,
    outputSchema: GenerateDynamicPlayerCardOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {text: prompt(input).prompt!},
        {media: {url: input.photoUrl}},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {playerCardDataUri: media!.url!};
  }
);
