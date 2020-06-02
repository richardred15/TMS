# TMS

## Ticket Management System
(This project is in the first hours of development e.g. the "getting it working" stage - feedback is encouraged)

Allow users to create tickets (contact forms) using simple templates

```javascript
    "form_type":{
        "form_field": {
            "type": "text/message/[selection]/phone/email/password",
            "options": {
                "Email": "Email",
                "Text": "Text",
                "Call": "Call"
            },
            "label": "What to display in form",
            "priority": 1 // display order
        }
    }
```

```javascript
    "method": {
        "type": "selection",
        "options": {
            "Email": "Email",
            "Text": "Text",
            "Call": "Call"
        },
        "label": "Preferred contact method",
        "priority": 1
    }
```

![Field Example](https://i.imgur.com/41ZCdTN.png)
![Inspect Info](https://i.imgur.com/tCxFDnY.png)