// Unified AI configuration for both server and client.
// Edit this file to change providers, models, endpoints, and tool behavior.
// Secrets (API keys) must stay in .env — do not put keys in this file.

export const AI_CONFIG = {
  // Default provider used by the server when none is specified by the client
  defaultProvider: 'openai',

  // When a provider that doesn't support tools is selected but Web Search is ON,
  // the server switches to this provider for that request.
  webSearchProvider: 'gemini',

  providers: {
    openai: {
      label: 'OpenAI',
      endpoints: {
        chat: 'https://api.openai.com/v1/chat/completions',
        image: 'https://api.openai.com/v1/images/generations',
      },
      models: {
        categories: {
          instant: {
            default: 'gpt-4o-mini',
            allowed: ['gpt-4o-mini', 'gpt-4o', 'o4-mini', 'o4'],
          },
          thinkingMini: {
            default: 'o4-mini',
            allowed: ['o4-mini', 'o4', 'gpt-4o'],
          },
          thinking: {
            default: 'o4',
            allowed: ['o4', 'gpt-4o', 'o4-mini'],
          },
        },
      },
      tools: {
        supportsTools: true,
        alwaysEnable: false, // When true, tools are enabled even if Web Search is off
        webSearchTool: true, // default if no per-model override
        fetchUrlTool: true, // default if no per-model override
      },
      // Per-model tool configuration
      modelTools: {
        'gpt-4o-mini': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
        'o4-mini': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
        'o4': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
      },
    },

    openrouter: {
      label: 'OpenRouter',
      endpoints: {
        chat: 'https://openrouter.ai/api/v1/chat/completions',
      },
      models: {
        categories: {
          instant: {
            default: 'openai/gpt-4o-mini',
            allowed: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
          },
          thinkingMini: {
            default: 'openai/gpt-4o',
            allowed: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
          },
          thinking: {
            default: 'openai/gpt-4o',
            allowed: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
          },
        },
      },
      tools: {
        supportsTools: false, // this app does not use tools with OpenRouter
        alwaysEnable: false,
      },
      modelTools: {},
    },

    gemini: {
      label: 'Gemini',
      endpoints: {
        // Complete endpoint is constructed as `${base}/models/${model}:generateContent?key=...`
        base: 'https://generativelanguage.googleapis.com/v1beta',
      },
      models: {
        categories: {
          instant: {
            default: 'gemini-2.5-flash-lite',
            allowed: ['gemini-2.5-flash-lite'],
          },
          thinkingMini: {
            default: 'gemini-2.5-flash',
            allowed: ['gemini-2.5-flash'],
          },
          thinking: {
            default: 'gemini-2.5-pro',
            allowed: ['gemini-2.5-pro'],
          },
        },
      },
      tools: {
        supportsTools: true,
        // Gemini always enables all tools regardless of user preference
        alwaysEnable: true,
      },
      modelTools: {
        'gemini-2.5-flash-lite': {
          regular: { google_search: true, code_execution: true, url_context: true },
          web: { google_search: true, code_execution: true, url_context: true },
        },
        'gemini-2.5-flash': {
          regular: { google_search: true, code_execution: true, url_context: true },
          web: { google_search: true, code_execution: true, url_context: true },
        },
        'gemini-2.5-pro': {
          regular: { google_search: true, code_execution: true, url_context: true },
          web: { google_search: true, code_execution: true, url_context: true },
        },
      },
    },

    groq: {
      label: 'Groq',
      endpoints: {
        chat: 'https://api.groq.com/openai/v1/chat/completions',
      },
      models: {
        categories: {
          instant: {
            default: 'groq/compound-mini',
            allowed: ['groq/compound-mini'],
          },
          thinkingMini: {
            default: 'groq/compound',
            allowed: ['groq/compound', 'openai/gpt-oss-20b'],
          },
          thinking: {
            default: 'openai/gpt-oss-120b',
            allowed: ['openai/gpt-oss-120b'],
          },
        },
      },
      tools: {
        supportsTools: true,
        alwaysEnable: false,
        webSearchTool: true, // default if no per-model override
        fetchUrlTool: true,  // default if no per-model override
      },
      modelTools: {
        'llama-3.1-70b-versatile': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
        'llama-3.1-8b-instant': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
        'groq/compound': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
        'gemma2-9b-it': {
          regular: { web_search: false, fetch_url: false },
          web: { web_search: true, fetch_url: true },
        },
      },
    },
  },
  // Ordered chains per UI category and mode. The first available succeeds;
  // subsequent entries are fallbacks if a provider/model is unavailable.
  chains: {
    instant: {
      regular: [
        { provider: 'gemini', model: 'gemini-2.5-flash-lite', tools: { url_context: true } },
        { provider: 'openrouter', model: 'groq/compound-mini' },
        { provider: 'openrouter', model: 'openai/gpt-oss-20b:free' },
      ],
      web: [
        { provider: 'gemini', model: 'gemini-2.5-flash-lite', tools: { google_search: true, url_context: true }, reasoning: 'low' },
        // OpenRouter does not use tools in this app; if selected during web mode, the server will skip to the next
        { provider: 'openrouter', model: 'groq/compound-mini', tools: { web_search: true, visit_website: true } },
        { provider: 'openrouter', model: 'openai/gpt-oss-20b', tools: { browser_search: true }, reasoning: 'low' },
      ],
    },
    thinkingMini: {
      regular: [
        { provider: 'openrouter', model: 'z-ai/glm-4.5-air:free' },
        { provider: 'openrouter', model: 'openai/gpt-oss-20b:free' },
      ],
      web: [
        { provider: 'gemini', model: 'gemini-2.5-flash', tools: { google_search: true, url_context: true, code_execution: true }, reasoning: 'medium' },
        { provider: 'openrouter', model: 'groq/compound', tools: { web_search: true, code_execution: true, visit_website: true, browser_automation: true } },
        { provider: 'openrouter', model: 'openai/gpt-oss-20b', tools: { browser_search: true, code_interpreter: true }, reasoning: 'medium' },
      ],
    },
    thinking: {
      regular: [
        { provider: 'openrouter', model: 'openai/gpt-oss-120b:free' },
        { provider: 'openrouter', model: 'deepseek/deepseek-r1-0528:free' },
        { provider: 'openrouter', model: 'deepseek/deepseek-chat-v3.1:free' },
      ],
      web: [
        { provider: 'openrouter', model: 'openai/gpt-oss-120b', tools: { browser_search: true, code_interpreter: true }, reasoning: 'high' },
        { provider: 'gemini', model: 'gemini-2.5-pro', tools: { google_search: true, url_context: true, code_execution: true }, reasoning: 'high' },
      ],
    },
  },
};

// UI model list and defaults for the dropdown in the client, and
// a mapping so the server can infer which category a chosen model belongs to.
export const UI_MODELS = [
  { id: 'gemini-2.5-flash-lite', label: 'Instant' },
  { id: 'gemini-2.5-flash', label: 'Thinking Mini' },
  { id: 'gemini-2.5-pro', label: 'Thinking' },
];

export const DEFAULT_UI_MODEL = UI_MODELS[0].id;

// Used by the server to pick the appropriate chain/category
// for a given UI-selected model id.
export const UI_ID_TO_CATEGORY = {
  'gemini-2.5-flash-lite': 'instant',
  'gemini-2.5-flash': 'thinkingMini',
  'gemini-2.5-pro': 'thinking',
};
