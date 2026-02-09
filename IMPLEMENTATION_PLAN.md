
## Technical Architecture

### State Management Flow
```mermaid
graph TD
    A[Content Script Init] --> B[StateManager]
    B --> C[StorageService]
    B --> D[CanvasAPIService]
    C --> E[chrome.storage.local]
    D --> F[Canvas API]
    B --> G[UI Components]
    G --> H[UrgentWidget]
    G --> I[TimelineView]
    G --> J[OverlayContainer]
```

### Authentication Flow
```mermaid
graph TD
    A[API Request] --> B{Session Cookie Valid?}
    B -->|Yes| C[Use Session Auth]
    B -->|No| D{API Token Exists?}
    D -->|Yes| E[Use Token Auth]
    D -->|No| F[Show Token Prompt]
    C --> G[Fetch Data]
    E --> G
    F --> H[User Enters Token]
    H --> E
```


### Data Filtering Logic

**Most Urgent (48-hour filter):**
```javascript
const urgentItems = plannableItems.filter(item => {
  const dueDate = new Date(item.plannable.due_at);
  const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
  return hoursUntilDue >= 0 && hoursUntilDue <= 48;
});
```

**Timeline Spacing:**
- Calculate date range (earliest to latest due date)
- Distribute assignments proportionally along horizontal axis
- Use CSS `transform: translateX()` for positioning
- Min spacing: 120px between cards to prevent overlap

---


