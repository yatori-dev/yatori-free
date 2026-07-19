import { ExternalLink, LibraryBig } from 'lucide-react';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface OpenSourceProject {
  name: string;
  description: string;
  license: string;
  url: string;
}

const OPEN_SOURCE_PROJECTS: OpenSourceProject[] = [
  {
    name: 'yatori-go-core',
    description: '学习通任务处理核心',
    license: 'MIT',
    url: 'https://github.com/yatori-dev/yatori-go-core',
  },
  {
    name: 'chaoxing_tool',
    description: '学习通课程文档资源下载、学习次数/时长处理核心',
    license: 'GPL-3.0',
    url: 'https://github.com/liuyunfz/chaoxing_tool',
  },
  {
    name: 'PassChaoxing',
    description: '学习通签到协议参考',
    license: 'MIT',
    url: 'https://github.com/qintaiyang/PassChaoxing',
  },
  {
    name: 'CxKitty',
    description: '学习通扫码登录协议参考',
    license: 'GPL-3.0',
    url: 'https://github.com/MMitsuha/CxKitty',
  }
];

export function OpenSourceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d2e30] sm:h-9 sm:w-9"
          aria-label="查看开源项目"
          title="开源项目"
        >
          <LibraryBig className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/50 px-5 py-5 pr-12 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LibraryBig className="h-5 w-5 text-primary" />
            鸣谢
          </DialogTitle>
          <DialogDescription>本服务参考或使用了以下开源项目。在此向各位开源社区作者表示最诚挚的感谢！</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[min(560px,calc(100dvh-10rem))] gap-2 overflow-y-auto p-4 sm:p-5">
          {OPEN_SOURCE_PROJECTS.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="group flex min-w-0 items-center gap-3 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <svg className="h-6 w-6" aria-hidden="true">
                  <use href="/icons.svg#github-icon" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span className="truncate">{project.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{project.description}</span>
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {project.license}
              </span>
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
