"""Main script to scrape Instagram stories and upload to Google Sheets."""
import logging
import sys
from pathlib import Path

from src.config import Config
from src.instagram_scraper import InstagramStoryScraper
from src.sheets_uploader import GoogleSheetsUploader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main execution function."""
    try:
        # Validate configuration
        logger.info("Validating configuration...")
        Config.validate()

        # Initialize Instagram scraper
        logger.info("Initializing Instagram scraper...")
        scraper = InstagramStoryScraper(
            username=Config.INSTAGRAM_USERNAME,
            password=Config.INSTAGRAM_PASSWORD
        )

        # Login to Instagram
        logger.info("Logging in to Instagram...")
        if not scraper.login():
            logger.error("Failed to login to Instagram")
            return 1

        # Fetch stories
        logger.info(f"Fetching stories from the past {Config.DAYS_TO_FETCH} days...")
        stories = scraper.get_own_stories(days=Config.DAYS_TO_FETCH)

        if not stories:
            logger.warning("No stories found")
            scraper.logout()
            return 0

        logger.info(f"Successfully fetched {len(stories)} stories")

        # Initialize Google Sheets uploader
        logger.info("Initializing Google Sheets uploader...")
        uploader = GoogleSheetsUploader(
            credentials_file=Config.GOOGLE_SHEETS_CREDENTIALS_FILE,
            spreadsheet_id=Config.SPREADSHEET_ID,
            worksheet_name=Config.WORKSHEET_NAME
        )

        # Authenticate with Google Sheets
        logger.info("Authenticating with Google Sheets...")
        if not uploader.authenticate():
            logger.error("Failed to authenticate with Google Sheets")
            scraper.logout()
            return 1

        # Upload stories to Google Sheets
        logger.info("Uploading stories to Google Sheets...")
        if not uploader.upload_stories(stories):
            logger.error("Failed to upload stories to Google Sheets")
            scraper.logout()
            return 1

        logger.info("Successfully uploaded stories to Google Sheets")

        # Logout from Instagram
        scraper.logout()

        logger.info("Process completed successfully")
        return 0

    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
