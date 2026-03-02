import { createCodeSuggestion } from "../db";
import { invokeLLM } from "../_core/llm";

export async function generateCodeSuggestions(
  repositoryUrl: string,
  fileContent: string,
  filePath: string
) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a code review expert. Analyze the provided code and suggest improvements for performance, security, accessibility, and best practices. 
          
          Respond with a JSON array of suggestions. Each suggestion should have:
          - suggestion: string (the improvement suggestion)
          - severity: "low" | "medium" | "high"
          - category: string (e.g., "performance", "security", "accessibility", "best-practices")
          
          Only include meaningful suggestions. If the code is well-written, return an empty array.`,
        },
        {
          role: "user",
          content: `Please review this code from ${filePath}:\n\n\`\`\`\n${fileContent}\n\`\`\``,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "code_suggestions",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                category: { type: "string" },
              },
              required: ["suggestion", "severity", "category"],
              additionalProperties: false,
            },
          },
        },
      },
    });
    
    let suggestions = [];
    try {
      const content = response.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        suggestions = JSON.parse(content);
      }
    } catch {
      console.warn("Failed to parse LLM response as JSON");
    }
    
    // Salvar sugestões no banco de dados
    for (const suggestion of suggestions) {
      await createCodeSuggestion({
        repositoryUrl,
        filePath,
        suggestion: suggestion.suggestion,
        severity: suggestion.severity,
        category: suggestion.category,
      });
    }
    
    return suggestions;
  } catch (error) {
    console.error("Error generating code suggestions:", error);
    return [];
  }
}

export async function analyzeRepositoryFiles(
  repositoryUrl: string,
  files: Array<{ path: string; content: string }>
) {
  const suggestions: any[] = [];
  
  // Analisar apenas arquivos HTML, CSS e JS
  const relevantFiles = files.filter(f =>
    /\.(html|css|js|jsx|ts|tsx)$/.test(f.path)
  );
  
  for (const file of relevantFiles.slice(0, 5)) { // Limitar a 5 arquivos para não sobrecarregar
    const fileSuggestions = await generateCodeSuggestions(
      repositoryUrl,
      file.content,
      file.path
    );
    suggestions.push(...fileSuggestions);
  }
  
  return suggestions;
}
