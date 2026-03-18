import os

from faker import Faker
from dotenv import load_dotenv
import mysql.connector


def main() -> None:
    # Load .env from the same folder as this script, if present
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)

    faker = Faker("pt_PT")

    num_users = int(os.getenv("NUM_UTILIZADORES", "10"))

    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "sistema_controlo_ambiental2"),
    )
    cursor = conn.cursor()

    users = []

    for _ in range(num_users):
        nome = faker.name()
        email = faker.unique.email()
        palavra_passe_hash = faker.sha256()  # fake hash, NOT secure
        data_criacao = faker.date_time_between(start_date="-1y", end_date="now")
        admin_flag = faker.boolean(chance_of_getting_true=20)  # ~20% admins

        users.append((
            nome,
            email,
            palavra_passe_hash,
            data_criacao,
            int(admin_flag),
        ))

    insert_sql = """
        INSERT INTO Utilizadores
        (nome, email, palavra_passe_hash, data_criacao, admin)
        VALUES (%s, %s, %s, %s, %s)
    """

    cursor.executemany(insert_sql, users)
    conn.commit()

    print(f"Inserted {cursor.rowcount} fake Utilizadores rows.")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
