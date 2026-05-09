from pydantic import BaseModel


class SearchResult(BaseModel):
    page_id: int
    page_title: str
    snippet: str
    match_type: str
