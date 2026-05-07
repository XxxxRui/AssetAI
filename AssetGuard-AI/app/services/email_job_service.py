from __future__ import annotations

import os
import uuid
from concurrent.futures import ThreadPoolExecutor

from flask import current_app

from app.extensions import db
from app.models import EmailJob
from app.services.evaluation_service import EvaluationService
from app.utils.errors import ApiError

_EXECUTOR = ThreadPoolExecutor(max_workers=4)


class EmailJobService:
    @staticmethod
    def create_job(*, evaluation_id: int, requester_email: str) -> dict:
        job_id = str(uuid.uuid4())
        job = EmailJob(id=job_id, evaluation_id=evaluation_id, status="processing")
        db.session.add(job)
        db.session.commit()

        async_enabled = current_app.config.get("EMAIL_ASYNC_ENABLED", True)
        if async_enabled:
            app = current_app._get_current_object()
            _EXECUTOR.submit(EmailJobService._run_in_app_context, app, job_id, evaluation_id, requester_email)
        else:
            EmailJobService._execute_job(job_id=job_id, evaluation_id=evaluation_id, requester_email=requester_email)

        return {"jobId": job_id, "accepted": True}

    @staticmethod
    def _run_in_app_context(app, job_id: str, evaluation_id: int, requester_email: str) -> None:
        with app.app_context():
            EmailJobService._execute_job(job_id=job_id, evaluation_id=evaluation_id, requester_email=requester_email)

    @staticmethod
    def _execute_job(*, job_id: str, evaluation_id: int, requester_email: str) -> None:
        job = EmailJob.query.filter_by(id=job_id).first()
        if job is None:
            return
        try:
            result = EvaluationService.send_evaluation_email(
                evaluation_id=evaluation_id,
                requester_email=requester_email,
            )
            job.status = "success"
            job.recipients = result["recipients"]
            job.sent_recipients = result["sentRecipients"]
            job.failed_recipients = result["failedRecipients"]
            job.error = None
        except Exception as exc:
            job.status = "failed"
            job.error = str(exc)
        db.session.add(job)
        db.session.commit()

    @staticmethod
    def get_job(job_id: str) -> dict:
        job = EmailJob.query.filter_by(id=job_id).first()
        if job is None:
            raise ApiError("Email job not found", 404, code="email_job_not_found")
        return {
            "jobId": job.id,
            "status": job.status,
            "evaluationId": job.evaluation_id,
            "recipients": job.recipients or [],
            "sentRecipients": job.sent_recipients or [],
            "failedRecipients": job.failed_recipients or [],
            "error": job.error,
        }
