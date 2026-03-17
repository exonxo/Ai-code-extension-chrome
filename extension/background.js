// background.js — Handles LLM API calls from content script

const SYSTEM_PROMPTS = {
  refine: 'Improve this prompt for clarity and specificity. Keep the same intent. Return only the improved prompt, nothing else.',
  structured: 'Rewrite this prompt with clear sections, numbered steps, or bullet points as appropriate. Keep the same intent. Return only the improved prompt.',
  expert: 'Rewrite this prompt as a domain expert would write it — precise language, explicit constraints, defined output format. Return only the improved prompt.'
};

chrome.runtime.onInstalled.addListener(async () => {
  const { schemaVersion } = await chrome.storage.local.get('schemaVersion');
  if (!schemaVersion) {
    await chrome.storage.local.set({
      schemaVersion: 1,
      settings: null,
      drafts: {},
      savedPrompts: []
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'improve-prompt') {
    handleImprovePrompt(message)
      .then(result => sendResponse({ success: true, text: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keeps message channel open for async response
  }
});

async function handleImprovePrompt({ action, prompt }) {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings || !settings.apiKey || !settings.provider) {
    throw new Error('API key not configured');
  }

  const systemPrompt = SYSTEM_PROMPTS[action];
  if (!systemPrompt) throw new Error('Unknown action: ' + action);

  if (settings.provider === 'openai') {
    return callOpenAI(settings.apiKey, systemPrompt, prompt);
  } else if (settings.provider === 'anthropic') {
    return callAnthropic(settings.apiKey, systemPrompt, prompt);
  } else if (settings.provider === 'groq') {
    return callGroq(settings.apiKey, systemPrompt, prompt);
  } else {
    throw new Error('Unknown provider: ' + settings.provider);
  }
}

async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('OpenAI API error (' + res.status + '): ' + body);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function callAnthropic(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Anthropic API error (' + res.status + '): ' + body);
  }

  const data = await res.json();
  return data.content[0].text.trim();
}

async function callGroq(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Groq API error (' + res.status + '): ' + body);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}
