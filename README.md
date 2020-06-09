# TMS

## Ticket Management System
Allow users to create tickets (contact forms) using simple templates

Click Below for Video Demonstration
[![Alt text](https://img.youtube.com/vi/GIiNb3qD6Go/1.jpg)](https://www.youtube.com/watch?v=GIiNb3qD6Go)

### Demo Admin https://richard.works/projects/TMS/admin/
```
username: admin
password: password
```
### Demo Client https://richard.works/projects/TMS/client/

### Install
```
git clone https://github.com/richardred15/TMS.git .
cd TMS
chmod +x setup.sh
./setup.sh
```
#### Post Setup
```
cd server
sudo npm install
node server.js
```

### User Create - Node Server Command
```
user@address:/path/to/server# node server.js
Server Initialized...
new admin <username> <password>
Administrator "<username>" successfully created!
```
![Admin Login](https://i.imgur.com/a9nfrCj.png)
#### Admin View
![Admin View](https://i.imgur.com/pAJeQp5.png)
#### New Admin Ticket
![New Ticket](https://i.imgur.com/zJEOZMf.png)
#### Ticket Status Indication
![Status Indicator](https://i.imgur.com/OiMqrKQ.gif)
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
#### Example (more in server/template.json)
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

## TODO
- [ ] Input Verification
- [ ] Email Configuration
- [ ] Email Templates