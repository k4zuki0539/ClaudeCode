"""Google Sheets uploader for Instagram Stories data."""
import logging
from typing import List, Dict, Any
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GoogleSheetsUploader:
    """Upload Instagram Stories data to Google Sheets."""

    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    HEADERS = [
        'ストーリーID',
        '投稿日時',
        'メディアタイプ',
        'メディアURL',
        'サムネイルURL',
        '閲覧数',
        'リーチ数',
        '返信数',
        'キャプション'
    ]

    def __init__(self, credentials_file: str, spreadsheet_id: str, worksheet_name: str = 'Stories'):
        """
        Initialize Google Sheets uploader.

        Args:
            credentials_file: Path to Google service account credentials JSON
            spreadsheet_id: Google Spreadsheet ID
            worksheet_name: Name of the worksheet to use
        """
        self.credentials_file = Path(credentials_file)
        self.spreadsheet_id = spreadsheet_id
        self.worksheet_name = worksheet_name
        self.client = None
        self.worksheet = None

    def authenticate(self) -> bool:
        """
        Authenticate with Google Sheets API.

        Returns:
            bool: True if authentication successful
        """
        try:
            if not self.credentials_file.exists():
                logger.error(f"Credentials file not found: {self.credentials_file}")
                return False

            creds = Credentials.from_service_account_file(
                str(self.credentials_file),
                scopes=self.SCOPES
            )

            self.client = gspread.authorize(creds)
            logger.info("Successfully authenticated with Google Sheets")
            return True

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False

    def get_or_create_worksheet(self):
        """Get existing worksheet or create new one."""
        try:
            spreadsheet = self.client.open_by_key(self.spreadsheet_id)

            # Try to get existing worksheet
            try:
                self.worksheet = spreadsheet.worksheet(self.worksheet_name)
                logger.info(f"Found existing worksheet: {self.worksheet_name}")
            except gspread.exceptions.WorksheetNotFound:
                # Create new worksheet
                self.worksheet = spreadsheet.add_worksheet(
                    title=self.worksheet_name,
                    rows=1000,
                    cols=len(self.HEADERS)
                )
                logger.info(f"Created new worksheet: {self.worksheet_name}")

                # Add headers
                self.worksheet.append_row(self.HEADERS)
                logger.info("Added headers to worksheet")

        except Exception as e:
            logger.error(f"Error accessing worksheet: {e}")
            raise

    def upload_stories(self, stories: List[Dict[str, Any]]) -> bool:
        """
        Upload stories data to Google Sheets.

        Args:
            stories: List of story dictionaries

        Returns:
            bool: True if upload successful
        """
        try:
            if not self.client:
                logger.error("Not authenticated. Call authenticate() first.")
                return False

            self.get_or_create_worksheet()

            if not stories:
                logger.warning("No stories to upload")
                return True

            # Get existing story IDs to avoid duplicates
            existing_data = self.worksheet.get_all_values()
            existing_ids = set(row[0] for row in existing_data[1:] if row)  # Skip header

            # Prepare rows for upload
            rows_to_add = []
            for story in stories:
                story_id = str(story.get('story_id', ''))

                # Skip if already exists
                if story_id in existing_ids:
                    logger.info(f"Story {story_id} already exists, skipping")
                    continue

                row = [
                    story_id,
                    story.get('posted_at', ''),
                    story.get('media_type', ''),
                    story.get('media_url', ''),
                    story.get('thumbnail_url', ''),
                    story.get('views', 0),
                    story.get('reach', 0),
                    story.get('replies', 0),
                    story.get('caption', '')
                ]
                rows_to_add.append(row)

            # Upload new rows
            if rows_to_add:
                self.worksheet.append_rows(rows_to_add)
                logger.info(f"Successfully uploaded {len(rows_to_add)} new stories")
            else:
                logger.info("No new stories to upload (all already exist)")

            return True

        except Exception as e:
            logger.error(f"Error uploading stories: {e}")
            return False

    def clear_worksheet(self):
        """Clear all data from worksheet (except headers)."""
        try:
            if not self.worksheet:
                self.get_or_create_worksheet()

            # Get all values and keep only header
            all_values = self.worksheet.get_all_values()
            if len(all_values) > 1:
                # Delete all rows except header
                self.worksheet.delete_rows(2, len(all_values))
                logger.info("Cleared worksheet data")

        except Exception as e:
            logger.error(f"Error clearing worksheet: {e}")
