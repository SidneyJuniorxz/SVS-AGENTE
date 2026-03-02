export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  content?: string;
}

export async function getGitHubRepositoryFiles(
  owner: string,
  repo: string,
  token: string,
  path: string = ""
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      content: item.type === "file" ? item.content : undefined,
    }));
  } catch (error) {
    console.error("Error fetching GitHub files:", error);
    throw error;
  }
}

export async function getGitHubFileContent(
  owner: string,
  repo: string,
  token: string,
  path: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error("Error fetching GitHub file content:", error);
    throw error;
  }
}

export async function createGitHubBranch(
  owner: string,
  repo: string,
  token: string,
  branchName: string,
  baseBranch: string = "main"
): Promise<{ success: boolean; message: string }> {
  try {
    // Obter SHA do branch base
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    
    if (!refResponse.ok) {
      return { success: false, message: "Failed to get base branch SHA" };
    }
    
    const refData = await refResponse.json() as any;
    const sha = refData.object.sha;
    
    // Criar nova branch
    const createResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha,
        }),
      }
    );
    
    if (!createResponse.ok) {
      return { success: false, message: "Failed to create branch" };
    }
    
    return { success: true, message: `Branch ${branchName} created successfully` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}

export async function createGitHubPullRequest(
  owner: string,
  repo: string,
  token: string,
  title: string,
  body: string,
  head: string,
  base: string = "main"
): Promise<{ success: boolean; prUrl?: string; message: string }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base,
        }),
      }
    );
    
    if (!response.ok) {
      return { success: false, message: "Failed to create pull request" };
    }
    
    const data = await response.json() as any;
    return {
      success: true,
      prUrl: data.html_url,
      message: "Pull request created successfully",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}
