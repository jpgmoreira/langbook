#!/usr/bin/env python3
import sqlite3
import random
import string
import uuid
import json
import time


def random_text(length=10):
    """Generate random alphanumeric text."""
    letters = string.ascii_letters + string.digits
    return "".join(random.choice(letters) for _ in range(length))


def generate_card(session_id):
    """Generate a single card dictionary matching the table schema."""
    now = int(time.time() * 1000)  # milliseconds timestamp
    return {
        "id": str(uuid.uuid4()),
        "front": random_text(8),
        "back": random_text(12),
        "extra": random_text(5),
        "allowReversed": 0,  # default FALSE
        "createdAt": now,
        "frequency": random.randint(1, 10),
        "tags": json.dumps([]),
        "sessions": json.dumps([session_id]),
        "media": json.dumps([]),
        "height": 0,
    }


def main():
    try:
        N = int(input("Enter number of cards to generate: "))
    except ValueError:
        print("Please enter a valid number.")
        return

    # Generate a session ID
    session_id = str(uuid.uuid4())
    print(f"Session ID: {session_id}")

    # Connect to SQLite database
    conn = sqlite3.connect("db.sqlite")
    cursor = conn.cursor()

    # Create table "cards"
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        front TEXT NOT NULL,
        back TEXT NOT NULL DEFAULT '',
        extra TEXT NOT NULL DEFAULT '',
        allowReversed BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt INTEGER NOT NULL,
        frequency INTEGER NOT NULL,
        tags TEXT NOT NULL,
        sessions TEXT NOT NULL,
        media TEXT NOT NULL,
        height INTEGER NOT NULL
    )
    """)

    # Generate N cards
    cards = [generate_card(session_id) for _ in range(N)]

    # Insert into table
    cursor.executemany(
        """
    INSERT INTO cards 
    (id, front, back, extra, allowReversed, createdAt, frequency, tags, sessions, media, height)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        [
            (
                c["id"],
                c["front"],
                c["back"],
                c["extra"],
                c["allowReversed"],
                c["createdAt"],
                c["frequency"],
                c["tags"],
                c["sessions"],
                c["media"],
                c["height"],
            )
            for c in cards
        ],
    )

    conn.commit()
    conn.close()
    print(f"{N} cards generated in 'db.sqlite'.")


if __name__ == "__main__":
    main()
