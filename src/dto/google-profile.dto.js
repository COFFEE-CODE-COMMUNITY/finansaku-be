export class GoogleProfileDto {
  constructor(profile) {
    this.email = profile.email
    this.name = profile.name
    this.picture = profile.picture
  }
}
