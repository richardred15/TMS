# TMS

## Ticket Management System
Allow users to create tickets (contact forms) using simple templates

### Install
```
git clone https://github.com/richardred15/TMS.git .
cd TMS
chmod +x setup.sh
./setup.sh
```
### server/template.json
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
#### Example
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