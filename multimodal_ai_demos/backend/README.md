## Python Backends

Make sure you have installed poetry and all the dependencies. If not, go to the root directory of the project and run:
```bash
poetry install
```

You can deploy any of the backends using the realtime CLI. 
```bash
poetry shell
realtime deploy <file_name>
```

All available backends:
1. [cooking_assistant.py](cooking_assistant.py): A demo that uses camera and microphone audio to help you cook.
2. [poker_commentator.py](poker_commentator.py): A demo that uses screenshare and microphone audio to commentate a live poker game.
3. [vision_bot.py](vision_bot.py): A demo that uses camera and audio to help you identify objects.
4. [chat_bot.py](chat_bot.py): A demo that uses chat and audio to build a chatbot.
