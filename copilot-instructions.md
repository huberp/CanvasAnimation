#### **Writing Concise and High-Quality Content**
To ensure that README files, PR descriptions, and comments are concise but maintain quality, follow these guidelines:

1. **General Guidelines**:
   - Focus on the **purpose of the content** and remove unnecessary details.
   - Use **bullet points** or **tables** for clarity and brevity.
   - Write in **active voice** to reduce wordiness.
   - Avoid redundancy—state each point clearly and only once.

2. **README Files**:
   - Include only essential sections (e.g., Overview, Setup Instructions, Usage, Contributing).
   - Prefer short paragraphs or lists.
   - Provide links to detailed documentation instead of explaining everything inline.
   - Example:
     - **Verbose**: _"This project is a tool for managing user authentication and authorization in a scalable and secure way. It provides utilities for handling login, logout, and managing user roles and permissions."_
     - **Concise**: _"A tool for secure and scalable user authentication, including login, logout, and role management."_

3. **Pull Request Descriptions**:
   - Summarize the purpose of the PR in **2-3 sentences**.
   - Mention key changes and their impact.
   - Example:
     - **Verbose**: _"This pull request adds a new feature that allows users to log in using their Google accounts. It also includes refactoring of the authentication module to make it reusable for other login methods in the future."_  
     - **Concise**: _"Adds Google login support and refactors authentication for reusability."_  

4. **Code Comments**:
   - Keep comments short and focused on **why** the code exists, not what it does (the code itself should explain that).
   - Example:
     - **Verbose**: _"This function is responsible for validating the user's input. It checks if the input is empty and also ensures that the input matches the required format before passing it to the next step."_  
     - **Concise**: _"Validates user input for emptiness and format."_  

5. **Commit Messages**:
   - Use <a href="https://www.conventionalcommits.org/">Conventional Commits</a> to structure messages.
   - Example: _"fix(auth): resolve empty input validation issue"_

6. **Tools for Enforcing Conciseness**:
   - Use tools like **Grammarly**, **Vale**, or **linter rules** for writing style checks.
   - Regularly review generated content for clarity and conciseness.

---

### **How to Implement These Suggestions**
You can implement these suggestions by:
1. **Updating Your `Copilot-Instructions.md` File**:
   - Add the section above to the file.
   - Ensure it is visible to contributors and included in your repository's documentation.

2. **Set Expectations**:
   - During code reviews, check if contributors adhere to these guidelines for README files, PRs, and comments.
   - Use the **Code Review Checklist** in the `Copilot-Instructions.md` to verify conciseness.

3. **Automate Checks**:
   - Use tools like **Vale** to enforce brevity in README files and comments.
   - Add a CI step to check PR descriptions for unnecessary verbosity.

4. **Train Copilot**:
   - Use explicit prompts (e.g., "Generate a concise README section" or "Write a 2-sentence PR description").
