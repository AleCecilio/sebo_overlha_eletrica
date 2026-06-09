const bcrypt = require('bcryptjs');

(async () => {
    console.log(
        await bcrypt.hash('ale123', 12)
    );
})();