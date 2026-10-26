CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT uuidv7(),
    firebase_uid  text UNIQUE,
    email         citext NOT NULL UNIQUE,
    full_name     text NOT NULL,
    phone         text,
    role          text NOT NULL CHECK (role IN ('admin', 'mentor', 'parent')),
    status        text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

CREATE TABLE children (
    id                uuid PRIMARY KEY DEFAULT uuidv7(),
    parent_id         uuid NOT NULL REFERENCES users(id),
    mentor_id         uuid REFERENCES users(id),
    display_name      text NOT NULL,
    date_of_birth     date,
    avatar_key        text,
    pin_hash          text,
    sensory_settings  jsonb NOT NULL DEFAULT '{}',
    assigned_lessons  jsonb NOT NULL DEFAULT '[]',
    consent_version   text NOT NULL,
    consent_at        timestamptz NOT NULL DEFAULT now(),
    status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);
CREATE INDEX children_parent_idx ON children (parent_id);
CREATE INDEX children_mentor_idx ON children (mentor_id);

CREATE TABLE lessons (
    id            uuid PRIMARY KEY DEFAULT uuidv7(),
    slug          citext NOT NULL,
    version       integer NOT NULL,
    title         text NOT NULL,
    content       jsonb NOT NULL,
    status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'superseded', 'archived')),
    created_by    uuid NOT NULL REFERENCES users(id),
    published_by  uuid REFERENCES users(id),
    published_at  timestamptz,
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (slug, version)
);
CREATE UNIQUE INDEX lessons_one_draft ON lessons (slug) WHERE status = 'draft';
CREATE UNIQUE INDEX lessons_one_published ON lessons (slug) WHERE status = 'published';

CREATE TABLE attempts (
    id               uuid PRIMARY KEY DEFAULT uuidv7(),
    child_id         uuid NOT NULL REFERENCES children(id),
    lesson_id        uuid NOT NULL REFERENCES lessons(id),
    status           text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    steps_total      integer NOT NULL,
    steps_completed  integer NOT NULL DEFAULT 0,
    events           jsonb NOT NULL DEFAULT '[]',
    stars            integer NOT NULL DEFAULT 0 CHECK (stars >= 0),
    metadata         jsonb NOT NULL DEFAULT '{}',
    started_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz
);
CREATE INDEX attempts_child_idx ON attempts (child_id, started_at DESC);

CREATE TABLE remarks (
    id          uuid PRIMARY KEY DEFAULT uuidv7(),
    child_id    uuid NOT NULL REFERENCES children(id),
    author_id   uuid NOT NULL REFERENCES users(id),
    body        text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
    visibility  text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'shared')),
    seen_at     timestamptz,
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE INDEX remarks_child_idx ON remarks (child_id, created_at DESC);
CREATE INDEX remarks_unseen_idx ON remarks (created_at) WHERE seen_at IS NULL;

CREATE TABLE change_requests (
    id               uuid PRIMARY KEY DEFAULT uuidv7(),
    lesson_id        uuid NOT NULL REFERENCES lessons(id),
    requested_by     uuid NOT NULL REFERENCES users(id),
    reason           text NOT NULL,
    proposed_change  jsonb NOT NULL,
    status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by      uuid REFERENCES users(id),
    review_note      text,
    reviewed_at      timestamptz,
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX change_requests_pending_idx ON change_requests (created_at) WHERE status = 'pending';

CREATE TABLE audit_logs (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id     uuid REFERENCES users(id),
    action       text NOT NULL,
    entity_type  text NOT NULL,
    entity_id    text NOT NULL,
    diff         jsonb,
    ip           inet,
    request_id   text,
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO speechomania_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO speechomania_app;
REVOKE UPDATE, DELETE ON audit_logs FROM speechomania_app;
