BEGIN TRANSACTION;

CREATE TABLE login (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(100) NOT NULL,
    email text UNIQUE NOT NULL
);

COMMIT;