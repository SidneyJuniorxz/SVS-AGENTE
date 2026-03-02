import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getGitHubRepositoryFiles, getGitHubFileContent, createGitHubBranch, createGitHubPullRequest } from "../services/github";
import { generateCodeSuggestions, analyzeRepositoryFiles } from "../services/codeSuggestions";
import { getCodeSuggestions } from "../db";

export const githubRouter = router({
  getRepositoryFiles: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      token: z.string(),
      path: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await getGitHubRepositoryFiles(input.owner, input.repo, input.token, input.path);
    }),

  getFileContent: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      token: z.string(),
      path: z.string(),
    }))
    .query(async ({ input }) => {
      return await getFileContent(input.owner, input.repo, input.token, input.path);
    }),

  analyzeRepository: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      const repositoryUrl = `https://github.com/${input.owner}/${input.repo}`;
      
      try {
        // Obter arquivos principais
        const files = await getGitHubRepositoryFiles(input.owner, input.repo, input.token);
        
        // Filtrar arquivos HTML, CSS, JS
        const relevantFiles = files.filter(f =>
          f.type === "file" && /\.(html|css|js|jsx|ts|tsx)$/.test(f.path)
        );
        
        // Obter conteúdo dos arquivos
        const filesWithContent = await Promise.all(
          relevantFiles.slice(0, 5).map(async (file) => {
            try {
              const content = await getFileContent(input.owner, input.repo, input.token, file.path);
              return { path: file.path, content };
            } catch {
              return null;
            }
          })
        );
        
        const validFiles = filesWithContent.filter(f => f !== null) as Array<{ path: string; content: string }>;
        
        // Analisar arquivos
        const suggestions = await analyzeRepositoryFiles(repositoryUrl, validFiles);
        
        return {
          success: true,
          filesAnalyzed: validFiles.length,
          suggestionsGenerated: suggestions.length,
          suggestions,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          message,
        };
      }
    }),

  getCodeSuggestions: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const repositoryUrl = `https://github.com/${input.owner}/${input.repo}`;
      return await getCodeSuggestions(repositoryUrl, input.status);
    }),

  createBranch: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      token: z.string(),
      branchName: z.string(),
      baseBranch: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createGitHubBranch(
        input.owner,
        input.repo,
        input.token,
        input.branchName,
        input.baseBranch
      );
    }),

  createPullRequest: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      token: z.string(),
      title: z.string(),
      body: z.string(),
      head: z.string(),
      base: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createGitHubPullRequest(
        input.owner,
        input.repo,
        input.token,
        input.title,
        input.body,
        input.head,
        input.base
      );
    }),
});

async function getFileContent(owner: string, repo: string, token: string, path: string) {
  return await getGitHubFileContent(owner, repo, token, path);
}
