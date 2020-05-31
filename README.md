# TMS

## Ticket Management System
Allow users to create tickets (contact forms) using simple templates

```json
    "method": {
        "type": "text/message/(selection)/phone/email/password",
        "options": {
            "Email": "Email",
            "Text": "Text",
            "Call": "Call"
        },
        "label": "What to display in form",
        "priority": 1 // display order
    },
```