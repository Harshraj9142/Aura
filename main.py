#!/usr/bin/env python3
"""
Root entrypoint delegating to scraper/main.py for Render & CLI deployment flexibility.
Allows running 'python main.py --schedule' directly from repository root.
"""
import sys
import os

if __name__ == "__main__":
    scraper_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraper")
    os.chdir(scraper_dir)
    sys.path.insert(0, scraper_dir)
    from main import main
    main()
