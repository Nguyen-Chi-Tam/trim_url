# TODO List for Left-Aligning Image Select Components

## Current Task: Left-align the two file input sections in bioDetails.jsx

- [x] Edit src/components/ui/bioDetails.jsx: Locate the two `<div className="flex justify-center space-x-2">` wrappers (one for profile pic controls, one for background pic controls) and update to `justify-start` for left alignment.

## Followup
- [ ] Verify changes by reloading the bio page and checking alignment in edit mode.
- [ ] Test responsiveness on mobile/desktop.

# TODO List for Consolidating Profile Pic Update in Profile Page

## Current Task: Integrate profile pic upload into single "Thay đổi" button in profile.jsx

- [x] Edit src/pages/profile.jsx: Remove separate handleChangeProfilePic and button; integrate upload logic into handleUpdateProfile for combined name/profile_pic updates.
