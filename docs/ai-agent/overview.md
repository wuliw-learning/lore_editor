# AI Agent Overview

## Purpose

This folder is optimized for AI agents that need fast operational context before making code changes in Lore.

## Product Summary

Lore is a self-hosted, single-user notebook with:

- a FastAPI backend
- a React/Vite frontend
- a block editor with slash-menu insertion
- nested pages rendered as page cards
- SQLite and filesystem-backed uploads
- one-container deployment with Nginx and supervisord

## Current Product Assumptions

- one user only
- no registration
- no collaboration
- no public sharing
- no realtime sync
- all data is private behind auth

## Important Runtime Rules

- Database path in Docker: `/app/data/lore.db`
- Upload path in Docker: `/app/storage/uploads`
- Storage paths must remain volume-backed and must not regress to `/app/backend/...`
- Startup may migrate old storage from the mistaken legacy backend-relative path

## High-Risk Areas

- editor insertion order and focus handling
- nested page reference lifecycle
- page deletion semantics
- sticky sidebar layout on desktop versus drawer layout on mobile
- long text paste and textarea height recalculation

## Do Not Change Lightly

- JWT-in-HttpOnly-cookie auth model
- deletion rule that blocks deleting pages with child pages
- cleanup of nested page link references when a linked page is deleted
- keyboard interaction patterns already documented in this folder
