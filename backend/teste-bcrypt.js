const bcrypt = require('bcryptjs');

(async () => {
    const senha = 'Admin@123';

    const hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    const resultado = await bcrypt.compare(senha, hash);

    console.log(resultado);
})();