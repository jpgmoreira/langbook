import sqlite3
import random
from datetime import datetime, timedelta


def main():
    num_points = int(input("Enter the number of graph points: ").strip())

    db_filename = "graph.sqlite"

    # Open or create the SQLite file
    conn = sqlite3.connect(db_filename)
    cur = conn.cursor()

    # Create table (same structure as your Electron app)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS graph (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date INTEGER UNIQUE NOT NULL,
            minutesStudied INTEGER NOT NULL DEFAULT 0
        );
    """)

    # Clear previous data so UNIQUE(date) does not conflict
    cur.execute("DELETE FROM graph")

    # Start inserting data
    today = datetime.now().date()
    start_date = today - timedelta(days=num_points - 1)

    for i in range(num_points):
        current_date = start_date + timedelta(days=i)
        date_int = int(current_date.strftime("%Y%m%d"))
        minutes = random.randint(0, 180)  # mock value

        cur.execute(
            "INSERT INTO graph (date, minutesStudied) VALUES (?, ?)",
            (date_int, minutes),
        )

    conn.commit()
    conn.close()

    print(f"Created {db_filename} with {num_points} records.")


if __name__ == "__main__":
    main()
