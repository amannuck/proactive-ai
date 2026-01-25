# DeepSeek API Integration Reference

## Where DeepSeek is Called

The DeepSeek API is called in the **inventory agent script** (which was previously at `src/agents/inventory-agent.ts`).

## DeepSeek Configuration

The DeepSeek API is configured with these constants at the top of the agent file:

```typescript
const DEEPSEEK_ENDPOINT = 'https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions';
const DEEPSEEK_AUTH = 'a12a7d3705b12aeb46eb4cc8d77f5446';
const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3.2-Exp';
```

## Where It's Called

The DeepSeek API is called in the `generateRecommendations()` function, which would be in:

**File**: `src/agents/inventory-agent.ts` (if it exists)
**Function**: `generateRecommendations()`
**Approximate Location**: Around line 200-300 (in the HTTPS request section)

## Code Structure

Here's what the DeepSeek API call looks like:

```typescript
// Make request to DeepSeek API
const url = new URL(DEEPSEEK_ENDPOINT);

const requestData = JSON.stringify({
  model: DEEPSEEK_MODEL,
  messages: [
    {
      role: 'user',
      content: prompt,  // The prompt with inventory data
    },
  ],
  temperature: 0.2,
  max_tokens: 3000,
});

const response = await new Promise<string>((resolve, reject) => {
  const req = https.request(
    {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      timeout: 300000, // 5 minutes
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_AUTH}`,
        'Content-Length': Buffer.byteLength(requestData),
      },
    },
    (res: any) => {
      let body = '';
      res.on('data', (chunk: Buffer) => (body += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`DeepSeek API error ${res.statusCode}: ${body}`));
        }
      });
    }
  );

  req.on('error', reject);
  req.on('timeout', () => {
    req.destroy();
    reject(new Error('Request timeout'));
  });

  req.write(requestData);
  req.end();
});
```

## Request Details

**Endpoint**: `https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions`

**Method**: `POST`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer a12a7d3705b12aeb46eb4cc8d77f5446`

**Request Body**:
```json
{
  "model": "deepseek-ai/DeepSeek-V3.2-Exp",
  "messages": [
    {
      "role": "user",
      "content": "Analyze these critical inventory items..."
    }
  ],
  "temperature": 0.2,
  "max_tokens": 3000
}
```

## Response Handling

The response is parsed to extract the AI-generated recommendations:

```typescript
const aiResponse = JSON.parse(response);
const content = aiResponse.choices?.[0]?.message?.content;

// Extract JSON from response (AI might wrap it in markdown)
let jsonStr = content.trim();
if (jsonStr.startsWith('```json')) {
  jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
} else if (jsonStr.startsWith('```')) {
  jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
}

const recommendations = JSON.parse(jsonStr);
```

## Flow

1. Agent fetches inventory data from your API
2. Agent fetches supplier data from your API
3. Agent prepares prompt with inventory + supplier data
4. **Agent calls DeepSeek API** ← HERE
5. DeepSeek returns JSON recommendations
6. Agent parses response
7. Agent saves recommendations to your API

## To Verify DeepSeek is Being Called

If you recreate the agent file, look for:

1. **Constants at the top**:
   ```typescript
   const DEEPSEEK_ENDPOINT = 'https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions';
   const DEEPSEEK_AUTH = 'a12a7d3705b12aeb46eb4cc8d77f5446';
   const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3.2-Exp';
   ```

2. **HTTPS request**:
   ```typescript
   const req = https.request({
     hostname: url.hostname,  // Should be 'deepseekv32-3ca9s.paas.ai.telus.com'
     ...
     headers: {
       Authorization: `Bearer ${DEEPSEEK_AUTH}`,
       ...
     }
   });
   ```

3. **Model name in request**:
   ```typescript
   {
     model: DEEPSEEK_MODEL,  // Should be 'deepseek-ai/DeepSeek-V3.2-Exp'
     ...
   }
   ```

## Testing DeepSeek API Directly

You can test the DeepSeek API directly with curl:

```bash
curl -X POST "https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a12a7d3705b12aeb46eb4cc8d77f5446" \
  -d '{
    "model": "deepseek-ai/DeepSeek-V3.2-Exp",
    "messages": [
      {
        "role": "user",
        "content": "Hello, test message"
      }
    ],
    "temperature": 0.2,
    "max_tokens": 100
  }'
```

## Summary

- **File**: `src/agents/inventory-agent.ts` (currently deleted)
- **Function**: `generateRecommendations()`
- **Endpoint**: `https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions`
- **Auth**: `Bearer a12a7d3705b12aeb46eb4cc8d77f5446`
- **Model**: `deepseek-ai/DeepSeek-V3.2-Exp`

The DeepSeek API call happens **inside the agent script**, not in the API routes. The agent is a separate script that calls both your API and the DeepSeek API.
