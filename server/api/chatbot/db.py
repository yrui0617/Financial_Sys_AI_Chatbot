import psycopg2
from psycopg2.extras import RealDictCursor
import os

def get_connection():
    return psycopg2.connect(
        host="ep-plain-dew-aozoqncp.c-2.ap-southeast-1.aws.neon.tech",
        database="neondb",
        user="neondb_owner",
        password="npg_FxNJBQUX9Ke7",
        port=5432,
        sslmode="require",
        cursor_factory=RealDictCursor
    )