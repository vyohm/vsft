# Missing Photos - Catalogue Items Without Images

These 18 catalogue items do not have photos in the Supabase bucket and need images to be uploaded.

## Designs Missing Photos:

1. NK0201
2. RS0030
3. RS0038
4. RS0039
5. SFT1614
6. SFT1689
7. SFT1695
8. SFT1703
9. SFT1752
10. SFT1768
11. SFT1786
12. SFT1794
13. SFT1804
14. SFT1805
15. SFT1815
16. SFT1819
17. SFT1820
18. SFT1831

## Next Steps:

1. Add photos for these designs to the Supabase bucket:
   - Location: `test-buck/photoshoots` (for default photos)
   - Or: `test-buck/photoshoots-colored` (for color-specific photos)

2. Naming convention:
   - Default photo: `DESIGN.png` (e.g., `NK0201.png`)
   - Color variant: `DESIGN-COLOR.png` (e.g., `NK0201-BLUE.png`)

3. After uploading photos, run the import script again:
   ```bash
   node scripts/import-photos.js --execute
   ```

## Status:
- **Catalogue items with photos**: 110 (86%)
- **Catalogue items without photos**: 18 (14%)
- **Total catalogue items**: 128
