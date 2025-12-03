"""Instagram Stories scraper using instagrapi."""
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any

from instagrapi import Client
from instagrapi.exceptions import LoginRequired

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InstagramStoryScraper:
    """Scraper for Instagram Stories with insights."""

    def __init__(self, username: str, password: str, session_file: str = "instagram_session.json"):
        """
        Initialize Instagram scraper.

        Args:
            username: Instagram username
            password: Instagram password
            session_file: Path to session file for persistence
        """
        self.username = username
        self.password = password
        self.session_file = Path(session_file)
        self.client = Client()
        self.client.delay_range = [1, 3]  # Add delay to avoid rate limiting

    def login(self) -> bool:
        """
        Login to Instagram with session persistence.

        Returns:
            bool: True if login successful
        """
        try:
            # Try to load existing session
            if self.session_file.exists():
                logger.info("Loading existing session...")
                self.client.load_settings(self.session_file)
                try:
                    self.client.login(self.username, self.password)
                    logger.info("Logged in using existing session")
                    return True
                except LoginRequired:
                    logger.warning("Session expired, logging in again...")
                    self.session_file.unlink()

            # Fresh login
            logger.info("Performing fresh login...")
            self.client.login(self.username, self.password)

            # Save session
            self.client.dump_settings(self.session_file)
            logger.info("Successfully logged in and saved session")
            return True

        except Exception as e:
            logger.error(f"Login failed: {e}")
            return False

    def get_own_stories(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get own stories from the past N days with insights.

        Args:
            days: Number of days to look back

        Returns:
            List of story data with insights
        """
        try:
            user_id = self.client.user_id
            logger.info(f"Fetching stories for user ID: {user_id}")

            # Get stories
            stories = self.client.user_stories(user_id)
            logger.info(f"Found {len(stories)} stories")

            cutoff_date = datetime.now() - timedelta(days=days)
            story_data = []

            for story in stories:
                story_date = story.taken_at

                # Skip stories older than cutoff date
                if story_date < cutoff_date:
                    continue

                # Get story insights
                insights = self._get_story_insights(story.pk)

                data = {
                    'story_id': story.pk,
                    'posted_at': story_date.strftime('%Y-%m-%d %H:%M:%S'),
                    'media_type': story.media_type.name if hasattr(story.media_type, 'name') else str(story.media_type),
                    'media_url': self._get_media_url(story),
                    'thumbnail_url': story.thumbnail_url if hasattr(story, 'thumbnail_url') else '',
                    'views': insights.get('impressions', 0),
                    'reach': insights.get('reach', 0),
                    'replies': insights.get('replies', 0),
                    'caption': story.caption_text if hasattr(story, 'caption_text') else '',
                }

                story_data.append(data)
                logger.info(f"Processed story {story.pk} from {data['posted_at']}")

            logger.info(f"Successfully retrieved {len(story_data)} stories within {days} days")
            return story_data

        except Exception as e:
            logger.error(f"Error fetching stories: {e}")
            return []

    def _get_media_url(self, story) -> str:
        """Extract media URL from story."""
        try:
            if hasattr(story, 'video_url') and story.video_url:
                return story.video_url
            elif hasattr(story, 'thumbnail_url') and story.thumbnail_url:
                return story.thumbnail_url
            else:
                return ''
        except Exception:
            return ''

    def _get_story_insights(self, story_pk: str) -> Dict[str, int]:
        """
        Get insights for a specific story.

        Args:
            story_pk: Story primary key

        Returns:
            Dictionary with insights data
        """
        try:
            insights = self.client.story_info(story_pk)

            return {
                'impressions': getattr(insights, 'view_count', 0) or 0,
                'reach': getattr(insights, 'viewer_count', 0) or 0,
                'replies': getattr(insights, 'reply_count', 0) or 0,
            }
        except Exception as e:
            logger.warning(f"Could not fetch insights for story {story_pk}: {e}")
            return {
                'impressions': 0,
                'reach': 0,
                'replies': 0,
            }

    def logout(self):
        """Logout from Instagram."""
        try:
            self.client.logout()
            logger.info("Logged out successfully")
        except Exception as e:
            logger.error(f"Logout error: {e}")
