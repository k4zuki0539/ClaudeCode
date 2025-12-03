"""Configuration management for Instagram Stories scraper."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""

    # Instagram credentials
    INSTAGRAM_USERNAME = os.getenv('INSTAGRAM_USERNAME')
    INSTAGRAM_PASSWORD = os.getenv('INSTAGRAM_PASSWORD')

    # Google Sheets configuration
    GOOGLE_SHEETS_CREDENTIALS_FILE = os.getenv('GOOGLE_SHEETS_CREDENTIALS_FILE', 'credentials.json')
    SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')
    WORKSHEET_NAME = os.getenv('WORKSHEET_NAME', 'Stories')

    # Optional settings
    DAYS_TO_FETCH = int(os.getenv('DAYS_TO_FETCH', '7'))

    @classmethod
    def validate(cls):
        """Validate required configuration."""
        required = [
            ('INSTAGRAM_USERNAME', cls.INSTAGRAM_USERNAME),
            ('INSTAGRAM_PASSWORD', cls.INSTAGRAM_PASSWORD),
            ('SPREADSHEET_ID', cls.SPREADSHEET_ID),
        ]

        missing = [name for name, value in required if not value]

        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")
