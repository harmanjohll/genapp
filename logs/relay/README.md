# Coach relay

A 90 line Cloudflare Worker that holds one Anthropic API key for the school, so
that no student ever creates an account or holds a key (the three major AI
providers all require account holders to be 18 or older, and Google's Gemini
API terms also forbid apps used by under 18s). The Learning Log page sends the
same request it would send to Anthropic; the Worker checks a class token,
applies a rate limit, pins the model and token cap, and forwards. It returns
Anthropic's answer unchanged, so the page does not know or care whether a key
or a relay is behind it.

## What you need before you start

1. An Anthropic Console account held by an adult with a school card:
   https://console.anthropic.com. Create an API key there. Read Anthropic's
   guidance for organisations serving minors once (AI disclosure, content
   moderation, monitoring); the app's design meets each point, but the
   responsibility is the school's:
   https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors
2. A Cloudflare account on a school or department address (free):
   https://dash.cloudflare.com/sign-up

## Path A: the dashboard, no command line (about fifteen minutes)

1. In the Cloudflare dashboard: Workers & Pages, Create, Create Worker. Name it
   `learning-log-coach`, Deploy the hello world, then Edit code.
2. Replace the whole file with `worker.js` from this folder. Save and deploy.
3. Settings, Variables and Secrets. Add:
   - `ANTHROPIC_API_KEY` (type Secret): the key from the Console.
   - `CLASS_TOKENS` (type Secret): a comma separated list, one token per class
     or teacher, for example `2E3-MATH-bee7,3N1-SCI-hive2`. Make them hard to
     guess; they are the only thing standing between a stranger and your key.
   - `ALLOWED_ORIGINS` (type Text): the site that serves `logs/`, with no
     trailing slash, for example `https://harmanjohll.github.io`.
   - `MODEL` (type Text): `claude-opus-5`, or `claude-sonnet-5` or
     `claude-haiku-4-5` if you want it cheaper.
4. Optional but recommended: Settings, Bindings, Add, Rate limiting. Variable
   name `LIMITER`, 20 requests per 60 seconds. The Worker uses it if present.
5. Note the Worker URL, for example
   `https://learning-log-coach.<account>.workers.dev`.

## Path B: the command line

```bash
npm i -g wrangler && wrangler login
cd logs/relay
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put CLASS_TOKENS
# edit ALLOWED_ORIGINS and MODEL in wrangler.toml, then
wrangler deploy
```

## Connect a class

In `teacher.html`, Coach service: paste the Worker URL and that teacher's
token, then download the class file or copy the share link. Students who load
the class get the AI coach automatically; nothing to type on their side.

## Test it

Open the student app with the class loaded, Settings, Coach, "School coach
link", then "Test the coach". A one line answer means the whole chain works.
A "class token not recognised" message means the token in the class file is
not in `CLASS_TOKENS`.

## Housekeeping

- Rotate `CLASS_TOKENS` every term; students share links.
- Workers Free allows 100,000 requests a day; a school will not approach it.
- Cost sits on the Anthropic side: roughly 1.7 cents a coach call on Opus 5,
  0.7 on Sonnet 5, 0.3 on Haiku 4.5. Set a monthly spend limit in the Console.
- This Worker writes nothing about the student's text anywhere. Cloudflare
  keeps request logs (IP, time, status). Anthropic's API retention policy
  applies to the prompt content; check the current policy before switching
  the relay on for a cohort.
