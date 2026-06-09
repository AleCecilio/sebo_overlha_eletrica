const bcrypt = require('bcrypt');

const senha = 'Admin@123';

const hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

bcrypt.compare(senha, hash).then(console.log);