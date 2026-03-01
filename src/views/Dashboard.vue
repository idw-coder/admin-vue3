<template>
  <div>
    <h1 class="text-h5 mb-4">ダッシュボード</h1>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card to="/notes/new" hover>
          <v-card-text class="d-flex align-center gap-3">
            <v-icon>mdi-note-plus</v-icon>
            <span>ノートを作成</span>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card to="/quizzes" hover>
          <v-card-text class="d-flex align-center gap-3">
            <v-icon>mdi-help-circle</v-icon>
            <span>クイズ管理</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
