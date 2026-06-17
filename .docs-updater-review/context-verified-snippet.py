import asyncio
from genkit import Genkit, ActionRunContext

ai = Genkit()

@ai.flow()
async def my_flow(friend_uid: str, ctx: ActionRunContext) -> str:
    return f"Context: {ctx.context}"

async def main():
    res = await my_flow.run("123", context={"auth": {"uid": "abc"}})
    print(res.response)

asyncio.run(main())
