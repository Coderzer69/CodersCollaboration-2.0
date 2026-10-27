# CodersCollaboration – Frontend

Open `index.html` in a browser (or serve the folder with any static server).

frontend/
  index.html      page markup (landing + editor view)
  css/style.css   all styles
  js/landing.js   hero animation (GSAP)
  js/editor.js    editor UI, Start-session animation, BACKEND HOOKS

## Connect your backend
In js/editor.js edit the `API` object:
- createRoom()          -> POST /api/rooms, return { id }
- onChange(room, files) -> send edits over your socket
- onRemote(cb)          -> call cb(files) when remote edits arrive

GSAP loads from cdnjs (3.12.5); fonts from Google Fonts.
