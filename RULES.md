# Development Rules & Guidelines 📋

This document outlines the rules and best practices for developing the FlashCard Learning App.

## 🎯 Project Goals
1. Create an intuitive and user-friendly learning experience
2. Ensure accessibility for users with different abilities
3. Build a scalable and maintainable codebase
4. Foster collaborative learning through group features

## 📝 Coding Standards

### File Naming Convention
- Use **camelCase** for JavaScript files: `flashCardService.js`
- Use **PascalCase** for React components: `FlashCard.jsx`
- Use **kebab-case** for CSS/styling files: `flash-card-styles.css`
- Use descriptive names that explain the file's purpose

### Code Organization
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (buttons, inputs)
│   ├── flashcard/      # Flashcard-specific components
│   └── group/          # Group-related components
├── pages/              # Main application pages
├── services/           # API calls and data management
├── utils/              # Helper functions
├── styles/             # CSS and styling files
└── assets/             # Images, icons, fonts
```

### Code Quality Rules

#### 1. **Keep It Simple (KISS Principle)**
- Write code that's easy to understand
- Avoid complex nested logic
- Use clear variable and function names

#### 2. **Component Structure**
```javascript
// ✅ Good: Clear structure
function FlashCard({ word, definition, onFlip }) {
  // State declarations first
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Event handlers
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip();
  };
  
  // Render
  return (
    <div className="flashcard" onClick={handleFlip}>
      {isFlipped ? definition : word}
    </div>
  );
}
```

#### 3. **Error Handling**
- Always handle potential errors
- Provide user-friendly error messages
- Log errors for debugging

#### 4. **Performance Guidelines**
- Optimize images before uploading
- Use lazy loading for media content
- Minimize API calls

## 🎨 UI/UX Guidelines

### Design Principles
1. **Accessibility First**
   - Use proper color contrast (minimum 4.5:1 ratio)
   - Provide alternative text for images
   - Support keyboard navigation
   - Include screen reader support

2. **Mobile-First Design**
   - Design for mobile devices first
   - Ensure responsive layout on all screen sizes
   - Touch-friendly interface elements

3. **Consistent Styling**
   - Use a unified color palette
   - Maintain consistent spacing and typography
   - Follow established design patterns

### Color Scheme
```css
:root {
  --primary-color: #4A90E2;      /* Main blue */
  --secondary-color: #50C878;    /* Success green */
  --warning-color: #FFB347;      /* Warning orange */
  --error-color: #FF6B6B;        /* Error red */
  --text-primary: #333333;       /* Main text */
  --text-secondary: #666666;     /* Secondary text */
  --background: #F8F9FA;         /* Page background */
}
```

## 🔒 Security Rules

### Data Protection
1. **Never store passwords in plain text**
2. **Validate all user inputs**
3. **Sanitize data before database storage**
4. **Use HTTPS for all communications**
5. **Implement proper authentication checks**

### File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Store files in secure cloud storage
- Limit file upload sizes

## 👥 Collaboration Guidelines

### Git Workflow
1. **Branch Naming**
   - `feature/add-audio-support`
   - `fix/login-bug`
   - `improve/ui-responsiveness`

2. **Commit Messages**
   ```
   feat: add audio recording feature to flashcards
   fix: resolve login authentication issue
   style: improve button hover effects
   docs: update API documentation
   ```

3. **Pull Request Rules**
   - Write clear descriptions
   - Include screenshots for UI changes
   - Test your changes before submitting
   - Request at least one code review

### Code Review Checklist
- [ ] Code follows naming conventions
- [ ] No console.log statements left in production code
- [ ] Error handling is implemented
- [ ] Code is properly commented
- [ ] UI is responsive and accessible
- [ ] Tests pass (when applicable)

## 🚀 Development Phases

### Phase 1: Core Features (Difficulty: ⭐⭐⭐)
- User registration and login
- Basic flashcard creation
- Simple study mode

### Phase 2: Enhanced Learning (Difficulty: ⭐⭐⭐⭐)
- Media upload (images, audio)
- Custom styling options
- Multiple choice test mode

### Phase 3: Social Features (Difficulty: ⭐⭐⭐⭐⭐)
- Study groups creation
- Role-based permissions
- Collaborative editing
- Feedback system

### Phase 4: Advanced Features (Difficulty: ⭐⭐⭐⭐⭐)
- Video support
- Advanced analytics
- AI-powered suggestions
- Mobile app version

## 📚 Learning Resources

### For Beginners
- [MDN Web Docs](https://developer.mozilla.org/) - Web development basics
- [React Documentation](https://react.dev/) - React.js guide
- [Cursor Documentation](https://docs.cursor.sh/) - Your code editor

### Best Practices
- Keep functions small and focused
- Use meaningful variable names
- Comment complex logic
- Test your code regularly

## 🛠 Tools and Technologies

### Required Tools
- **Cursor**: Your main code editor
- **Node.js**: JavaScript runtime
- **Git**: Version control
- **Browser Developer Tools**: For debugging

### Optional but Helpful
- **Postman**: API testing
- **Figma**: Design mockups
- **MongoDB Compass**: Database management

## 📞 Getting Help

### When You're Stuck
1. **Read error messages carefully**
2. **Check the documentation**
3. **Search for similar issues online**
4. **Ask specific questions with code examples**
5. **Use Cursor's AI assistant**

### Emergency Contacts
- Technical issues: Create a GitHub issue
- Urgent bugs: Contact team lead
- General questions: Check project wiki

---

## 📋 Checklist for New Contributors

- [ ] Read this RULES document completely
- [ ] Set up development environment
- [ ] Clone the repository
- [ ] Install all dependencies
- [ ] Run the project locally
- [ ] Make a small test change
- [ ] Submit your first pull request

---

**Remember: Good code is written for humans to read, not just for computers to execute!** 💻✨ 