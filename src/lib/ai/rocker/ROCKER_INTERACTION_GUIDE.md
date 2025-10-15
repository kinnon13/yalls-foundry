# Rocker UI Interaction Guide

## Making Elements Rocker-Accessible

To let Rocker interact with your UI elements (buttons, forms, etc.), add `data-rocker` attributes:

### Examples:

```tsx
// Buttons
<Button data-rocker="submit">Submit</Button>
<Button data-rocker="post">Post</Button>
<Button data-rocker="save">Save</Button>

// Form fields
<Input 
  data-rocker="title"
  placeholder="Title" 
/>

<Textarea 
  data-rocker="description"
  placeholder="Description" 
/>

<Input 
  data-rocker="comment"
  placeholder="Add a comment..." 
/>
```

## Voice Commands

Users can say:
- "Click submit" → Clicks the submit button
- "Type 'Hello world' in the title" → Fills title field
- "Set description to 'This is a test'" → Fills description
- "Click post button" → Clicks post button
- "Fill comment with 'Great job!'" → Fills comment field

## Auto-Detection

Rocker also auto-detects elements by:
- Button text content
- aria-label attributes
- Placeholder text
- Input names and IDs

But `data-rocker` provides the most reliable targeting.

## Example: Post Form

```tsx
function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  return (
    <form>
      <Input 
        data-rocker="post-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
      />
      
      <Textarea 
        data-rocker="post-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
      />
      
      <Button 
        data-rocker="create-post"
        type="submit"
      >
        Post
      </Button>
    </form>
  );
}
```

Now users can say:
- "Type 'My first post' in post title"
- "Set post content to 'Hello everyone!'"
- "Click create post"

## Best Practices

1. Use descriptive, consistent names
2. Keep names short and natural
3. Use lowercase with hyphens (kebab-case)
4. Match the natural language users would use

## Testing

To test what Rocker can see:
```javascript
window.__rockerDOMAgent.getButtons() // List all buttons
window.__rockerDOMAgent.getFields()  // List all form fields
```