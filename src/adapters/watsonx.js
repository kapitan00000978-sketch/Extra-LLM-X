import { BaseAdapter } from './base.js';

export class WatsonxAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'watsonx',
      name: 'IBM watsonx.ai',
      badge: 'Granite & Llama',
      getKeyUrl: 'https://cloud.ibm.com/iam/apikeys',
      guide: 'Create an IBM Cloud IAM API Key for watsonx enterprise granite foundation models.',
      freeTierInfo: '$200 IBM Cloud trial credit on new account signup',
      popularModels: 'ibm/granite-3-8b-instruct, ibm/granite-3-2b-instruct, meta-llama/llama-3-3-70b-instruct',
      keyPrefix: '',
      keyPlaceholder: 'ibm_cloud_iam_apikey_xxxxxxxx'
    });
    this.baseUrl = 'https://us-south.ml.cloud.ibm.com/ml/v1';
    this.freeModels = [
      {
            "id": "ibm/granite-3-8b-instruct",
            "name": "IBM Granite 3.0 8B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "ibm/granite-3-2b-instruct",
            "name": "IBM Granite 3.0 2B",
            "context": 128000,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `watsonx/${m.id}`,
      provider: 'watsonx',
      model_id: m.id,
      display_name: `${m.name} [IBM watsonx.ai]`,
      description: 'IBM watsonx.ai Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^watsonx\//, '');
    const body = { 
      model: rawModel, 
      messages, 
      stream, 
      ...(temperature !== undefined ? { temperature } : {}), 
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(tools?.length ? { tools, tool_choice } : {}) 
    };

    let targetUrl = `${this.baseUrl}/chat/completions`;
    

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`IBM watsonx.ai API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
