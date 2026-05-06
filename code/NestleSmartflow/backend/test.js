const bcrypt = require('bcrypt');
const hash = '$2b$10$.w3OPwIYOtmhtZtEoNIXBeWhT4qPdgLG3TmnJrYE5ZYe3ej56sTTy';
bcrypt.compare('password123', hash).then(console.log);
