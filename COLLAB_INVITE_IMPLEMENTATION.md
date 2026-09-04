# Collaboration Invite Link Implementation

This branch implements the BandLab-style collaboration flow requested for Crucible Forge.

## Required behavior
- Project owner opens **Invite Collaborators** and taps **Copy Invite Link**.
- Existing Crucible users follow the link, sign in if needed, and accept the collaboration.
- New users follow the same link, sign up, verify/sign in, and return to the original invite without losing it.
- Accepted collaborators are attached to the private project and appear in **My Tracks**.
- Collaborator profile pictures are displayed immediately beside the project owner/inviter in the project header/collaborator row.
- Invite links do not make projects public.
- Project owners can revoke or regenerate invite links and remove collaborators.
- Invite tokens must not expose project data without authorization.

## Verification checklist
- Copy-link path works on mobile and desktop.
- Existing-user acceptance works.
- New-user signup preserves the invite and returns to acceptance.
- Unauthorized users cannot read or edit project data from the invite token alone.
- Collaborator avatar renders beside the inviter after acceptance.
- Project remains private/unpublished after collaborator acceptance.
- Revoked invite cannot be reused.
- Regenerated invite invalidates the old token.
