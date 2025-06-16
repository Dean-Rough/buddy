#!/bin/bash

# Fix TimeWarning.tsx
sed -i '' 's/childAge: number/\_childAge: number/g' components/chat/TimeWarning.tsx
sed -i '' 's/import { useState, useEffect } from/import { useState } from/g' components/chat/TimeWarning.tsx

# Fix context-aware-warnings.ts
sed -i '' 's/import { ConversationContext, TimeManager } from/import { ConversationContext } from/g' lib/context-aware-warnings.ts
sed -i '' 's/childAge: number)/\_childAge: number)/g' lib/context-aware-warnings.ts
sed -i '' 's/context: ConversationContext)/\_context: ConversationContext)/g' lib/context-aware-warnings.ts
sed -i '' "s/behavior: 'gradual' | 'warning_only' | 'hard_stop'/\_behavior: 'gradual' | 'warning_only' | 'hard_stop'/g" lib/context-aware-warnings.ts

# Fix knowledge-base.ts
sed -i '' 's/KnowledgeError,//g' lib/knowledge/knowledge-base.ts
sed -i '' 's/confidence: number = 1.0/\_confidence: number = 1.0/g' lib/knowledge/knowledge-base.ts
sed -i '' 's/catch (error)/catch (\_error)/g' lib/knowledge/knowledge-base.ts
sed -i '' 's/error:/\_error:/g' lib/knowledge/knowledge-base.ts

# Fix natural-exit-generator.ts
sed -i '' 's/const ageGroupCategories/const \_ageGroupCategories/g' lib/natural-exit-generator.ts
sed -i '' 's/context: ConversationContext/\_context: ConversationContext/g' lib/natural-exit-generator.ts
sed -i '' 's/isWeekend: boolean = false/\_isWeekend: boolean = false/g' lib/natural-exit-generator.ts
sed -i '' 's/isAskingQuestions: boolean/\_isAskingQuestions: boolean/g' lib/natural-exit-generator.ts
sed -i '' 's/const strictnessConfig/const \_strictnessConfig/g' lib/natural-exit-generator.ts
sed -i '' 's/timeCategory: string/\_timeCategory: string/g' lib/natural-exit-generator.ts
sed -i '' 's/tone: string/\_tone: string/g' lib/natural-exit-generator.ts

# Fix time-management.ts
sed -i '' 's/session = /\_session = /g' lib/time-management.ts
sed -i '' "s/reason: 'time_limit' | 'manual' | 'parent_override'/\_reason: 'time_limit' | 'manual' | 'parent_override'/g" lib/time-management.ts

# Run ESLint fix
npm run lint -- --fix

# Run Prettier
npx prettier --write components/chat/TimeWarning.tsx lib/context-aware-warnings.ts lib/knowledge/knowledge-base.ts lib/natural-exit-generator.ts lib/time-management.ts 