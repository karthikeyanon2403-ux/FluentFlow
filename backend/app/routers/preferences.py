from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.session import UserPreferenceRecord
from app.models.schemas import UserPreferencesDTO

router = APIRouter(prefix="/api/preferences", tags=["Preferences"])

@router.get("", response_model=UserPreferencesDTO)
async def get_preferences(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(UserPreferenceRecord).where(UserPreferenceRecord.id == "default_user"))
    pref = res.scalar_one_or_none()
    if not pref:
        pref = UserPreferenceRecord(id="default_user")
        db.add(pref)
        await db.commit()
    return UserPreferencesDTO(**pref.to_dict())

@router.put("", response_model=UserPreferencesDTO)
async def update_preferences(data: UserPreferencesDTO, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(UserPreferenceRecord).where(UserPreferenceRecord.id == "default_user"))
    pref = res.scalar_one_or_none()
    if not pref:
        pref = UserPreferenceRecord(id="default_user")
        db.add(pref)

    pref.speech_speed = data.speech_speed
    pref.target_tone = data.target_tone
    pref.store_transcripts = data.store_transcripts
    pref.preferred_voice = data.preferred_voice
    pref.enable_confidence_analytics = data.enable_confidence_analytics

    await db.commit()
    return UserPreferencesDTO(**pref.to_dict())
