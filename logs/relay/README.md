# Coach relay

A 90 line Cloudflare Worker that holds one Anthropic API key for the school, so
that no student ever creates an account or holds a key (the three major AI
providers all require account holders to be 18 or older). The Learning Log
page sends the same request it would send to Anthropic; the Worker checks a
class token, applies a rate limit, pins the model and token cap, and forwards.

## Deploy (about ten minutes, free tier)

1. Create a Cloudflare account with a school or department address, then
   `npm i -g wrangler` and `wrangler login`.
2. In this folder: `wrangler secret put ANTHROPIC_API_KEY` (from an adult's
   Console account at console.anthropic.com), then
   `wrangler secret put CLASS_TOKENS` with a comma separated list, for example
   `2E3-MATH-bee7,3N1-SCI-hive2`. One token per class or per teacher.
3. Edit `ALLOWED_ORIGINS` in `wrangler.toml` to the GitHub Pages origin that
   serves `logs/` (no trailing slash).
4. `wrangler deploy`. Note the URL, for example
   `https://learning-log-coach.<account>.workers.dev`.
5. In `teacher.html`, paste that URL and the class token into the Coach
   section of the class file. Students who load the class code get the relay
   automatically.

Rotate `CLASS_TOKENS` every term. Workers Free gives 100,000 requests a day;
the rate limit binding caps each token and IP at 20 calls a minute.

## What is logged

Nothing about the student's text is written anywhere by this Worker.
Cloudflare's own request logs hold IP, time and status. Anthropic's data
retention policy for API requests applies to the prompt content; check the
current policy before switching this on for a cohort.
