# Contributing to Web3 Integration Recipes

Thank you for your interest in contributing to Web3 Integration Recipes! This guide will help you contribute effectively to this project.

## 🎯 Contribution Guidelines

### What We're Looking For

- **Production-ready code**: All examples should be suitable for real-world applications
- **Multiple framework support**: Provide implementations for React, Vue, and vanilla JS when applicable
- **Comprehensive documentation**: Include setup instructions, usage examples, and troubleshooting
- **Security-first approach**: Follow web3 security best practices
- **Modern standards**: Use current versions of web3 libraries

### Code Standards

#### JavaScript/TypeScript
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Include proper error handling
- Add JSDoc comments for public functions
- Use modern ES6+ features

#### Documentation
- Write clear, concise README files for each recipe
- Include code examples with explanations
- Provide step-by-step setup instructions
- Document common issues and solutions

## 🚀 Getting Started

### Setting Up Development Environment

1. **Fork and clone the repository**
```bash
git clone https://github.com/your-username/web3-integration-recipes.git
cd web3-integration-recipes
```

2. **Install dependencies**
```bash
npm install
```

3. **Create a feature branch**
```bash
git checkout -b feature/your-recipe-name
```

## 📝 Adding a New Recipe

### Recipe Structure

Each recipe should follow this structure:

```
recipes/category/recipe-name/
├── README.md                 # Main documentation
├── vanilla-js/              # Vanilla JavaScript implementation
│   ├── index.html
│   ├── script.js
│   └── style.css
├── react/                   # React implementation
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── hooks/
│   │   └── components/
│   └── README.md
├── vue/                     # Vue implementation
│   ├── package.json
│   ├── src/
│   │   ├── App.vue
│   │   └── components/
│   └── README.md
└── examples/                # Additional examples
    ├── advanced-usage.md
    └── troubleshooting.md
```

### Recipe README Template

Use this template for recipe documentation:

```markdown
# Recipe Name

Brief description of what this recipe accomplishes.

## Use Cases

- Use case 1
- Use case 2
- Use case 3

## Prerequisites

- Node.js 18+
- Wallet with testnet ETH
- Basic understanding of [specific concept]

## Quick Start

### Installation

\`\`\`bash
npm install ethers wagmi
\`\`\`

### Basic Usage

\`\`\`typescript
// Code example
\`\`\`

## Implementation Guides

- [Vanilla JavaScript](./vanilla-js/README.md)
- [React](./react/README.md)
- [Vue](./vue/README.md)

## Common Issues

### Issue 1
Description and solution.

### Issue 2
Description and solution.

## Security Considerations

- Security point 1
- Security point 2

## Further Reading

- [Related documentation]
- [External resources]
```

## 🔍 Code Review Process

### Before Submitting

1. **Test your code**: Ensure all examples work as expected
2. **Check documentation**: Verify all links work and instructions are clear
3. **Run linting**: Fix any ESLint or TypeScript errors
4. **Security review**: Check for potential security issues

### Submission Checklist

- [ ] Code follows project standards
- [ ] Documentation is complete and accurate
- [ ] Examples work in all supported frameworks
- [ ] Security considerations are addressed
- [ ] Tests are included (where applicable)
- [ ] No hardcoded private keys or sensitive data

### Pull Request Process

1. **Create descriptive PR title**
   - Good: "Add MetaMask connection recipe with error handling"
   - Bad: "Update files"

2. **Include comprehensive description**
   - What does this recipe solve?
   - How does it work?
   - Any breaking changes?

3. **Link related issues**
   - Use "Fixes #123" or "Addresses #456"

4. **Request review**
   - Tag relevant maintainers
   - Be responsive to feedback

## 🏷️ Types of Contributions

### New Recipes
Complete implementations solving specific web3 integration challenges.

### Recipe Improvements
- Bug fixes in existing recipes
- Performance optimizations
- Additional framework implementations
- Enhanced documentation

### Documentation Updates
- Fix typos or unclear instructions
- Add troubleshooting sections
- Improve code comments
- Update outdated information

### Utility Functions
Reusable functions that solve common web3 development problems.

### Templates
Complete starter projects that developers can use immediately.

## 📋 Issue Guidelines

### Reporting Bugs

Use this template:

```
**Bug Description**
Clear description of the issue.

**Steps to Reproduce**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- Node.js version:
- Browser:
- Web3 library version:
```

### Feature Requests

Use this template:

```
**Feature Description**
Clear description of the requested feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other approaches you've considered.
```

## 🎨 Style Guidelines

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Keep lines under 100 characters
- Use descriptive variable names

### Commit Messages
Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for test additions/changes

Examples:
- `feat: add MetaMask connection recipe for React`
- `fix: handle connection errors in wallet switching`
- `docs: update smart contract interaction guide`

## 🤝 Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help other contributors
- Ask questions when unclear
- Share knowledge generously

## 📞 Getting Help

- **Discord**: [Join our Discord](https://discord.gg/web3-recipes)
- **GitHub Issues**: Create an issue for bugs or questions
- **Discussions**: Use GitHub Discussions for general questions

---

**Thank you for helping make web3 development more accessible!**