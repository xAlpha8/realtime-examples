import time
import asyncio

import multiprocessing

multiprocessing.cpu_count()


async def run_rhubarb():
    start_time = time.time()
    cmd = " ".join(
        [
            "/Users/janakagrawal/Documents/GitHub/realtime-examples/lip_sync/rhubarb/rhubarb",
            "-f",
            "json",
            "-o",
            f"message_1.json",
            f"/Users/janakagrawal/Documents/GitHub/realtime-examples/lip_sync/visemenet_intro.wav",
            "-r phonetic",
            "--threads 1",
        ],
    )
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await proc.communicate()  # Read the output and error streams
    print(stdout.decode())
    print(stderr.decode())
    await proc.wait()
    print(f"Rhubarb took {time.time() - start_time} seconds to process the file")


asyncio.run(run_rhubarb())
