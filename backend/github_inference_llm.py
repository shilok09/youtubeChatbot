from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage as AzureSystemMessage, UserMessage as AzureUserMessage
from azure.core.credentials import AzureKeyCredential
from pydantic import PrivateAttr
from langchain_core.outputs import ChatGeneration, ChatResult

class GitHubInferenceLLM(BaseChatModel):
    token: str
    endpoint: str = "https://models.github.ai/inference"
    model: str = "openai/gpt-4.1"

    # Private attribute (not part of Pydantic model fields)
    _client: ChatCompletionsClient = PrivateAttr()

    def __init__(self, **data):
        super().__init__(**data)
        self._client = ChatCompletionsClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.token)
        )

    def _convert_message(self, message):
        if isinstance(message, SystemMessage):
            return AzureSystemMessage(content=message.content)
        elif isinstance(message, HumanMessage):
            return AzureUserMessage(content=message.content)
        else:
            raise ValueError("Unsupported message type")

    def _generate(self, messages, stop=None):
        converted = [self._convert_message(m) for m in messages]
        response = self._client.complete(
            messages=converted,
            temperature=1,
            top_p=1,
            model=self.model
        )
        return ChatResult(
            generations=[
                ChatGeneration(
                    message=AIMessage(content=response.choices[0].message.content)
                )
            ]
        )

    @property
    def _llm_type(self) -> str:
        return "github-inference"
