export const avatarOf = (user) => user.metadata?.avatar ?? user.id

export function remarkView({ author, ...remark }) {
  return {
    ...remark,
    author_name: author.full_name,
    author_role: author.role,
    author_avatar: avatarOf(author)
  }
}
